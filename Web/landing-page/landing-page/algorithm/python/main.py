import csv
import json
import scorer
def bubble_sort(arr):
    for n in range(len(arr) - 1, 0, -1):
        swapped = False  
        for i in range(n):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True
        if not swapped:
            break
    return arr

def get_ordered_project_ID_s(filename):
    project_ID_s = []
    global ID_row_dict 
    global fields
    ID_row_dict = {}
    with open(filename, 'r') as csvfile:
        reader = csv.reader(csvfile)
        fields = next(reader)
        fields.append("our score")
        for row in reader:
            if row[0].isdigit():
                ID = int(row[0])
                score = scorer.score_vcs_project(row)
                row.append(score)
                project_ID_s.append(ID)
                ID_row_dict[ID] = row
        return bubble_sort(project_ID_s) 

def split_arr(n, arr):
    part_size = len(arr) // n
    split = []
    for i in range(n-1):
        start = i * part_size
        end = start + part_size
        split.append(arr[start:end])
    split.append(arr[(n - 1)*part_size:])
    return split

def write_csv(name, arr):
    with open('../data/partitioned/' + name + '.csv', 'w') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(fields)
        for id in arr:
           csvwriter.writerow(ID_row_dict[id]) 
            
def create_lookup_table(partitions):
    lookup_table = {}
    filename = "lookuptable.json"
    for partition in partitions:
        name = "projects_" + str(partition[0]) + "_" + str(partition[-1]) + ".csv"
        for ID in partition:
            lookup_table[ID] = name
    with open('../data/partitioned/' + filename, 'w') as jsonfile:
        json.dump(lookup_table, jsonfile)

def main():
    partitions = 30
    ID_s = get_ordered_project_ID_s("../data/allprojects.csv")
    partitioned_ID_s = split_arr(partitions, ID_s)
    
    for partition in partitioned_ID_s:
       name = "projects_" + str(partition[0]) + "_" + str(partition[-1])
       write_csv(name, partition)
    create_lookup_table(partitioned_ID_s)

main()
        
